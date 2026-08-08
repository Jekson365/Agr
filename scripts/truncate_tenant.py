#!/usr/bin/env python3
"""Empty one tenant's database, keeping the migration history and the seeded catalogs.

Each user has their own Postgres database (``farm_user_{userId}``); this finds the one belonging
to an email address by looking the user up in the master database, then truncates every table
holding that user's records.

Six tables are kept by default besides ``__EFMigrationsHistory``: Units, ProductionTypes,
LivestockKinds, StockKinds, FruitKinds and Configurations. They hold reference data seeded by the
migrations, and EF will not put it back — HasData is applied by a migration, and the history table
already says those migrations ran. A tenant emptied without them has no units, no animal kinds and
no feature switches, and the app cannot record anything.

Tables are read from the live database rather than listed here, so a table added later is emptied
without this script being touched.

Runs as a dry run unless given --yes.

    python scripts/truncate_tenant.py --email jeko.erg@gmail.com          # show the plan
    python scripts/truncate_tenant.py --email jeko.erg@gmail.com --yes    # do it

Needs the psql client, which ships with Postgres; no Python packages are required. It is found on
PATH or under the standard Windows install directory, or given with --psql.
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
import subprocess
import sys

# Reference data seeded by the migrations. Emptying these leaves the app unusable — see the module
# docstring — so they are kept unless --drop-catalogs says otherwise.
SEEDED_CATALOGS = (
    "Units",
    "ProductionTypes",
    "LivestockKinds",
    "StockKinds",
    "FruitKinds",
    "Configurations",
)

MIGRATIONS_TABLE = "__EFMigrationsHistory"


def find_psql(explicit: str | None) -> str:
    """The psql executable: the one given, the one on PATH, or the newest Windows install."""
    if explicit:
        if not os.path.isfile(explicit):
            sys.exit(f"psql not found at {explicit}")
        return explicit

    found = shutil.which("psql")
    if found:
        return found

    # Newest major version first, so a machine with several installs uses the current one.
    candidates = sorted(glob.glob(r"C:\Program Files\PostgreSQL\*\bin\psql.exe"), reverse=True)
    if candidates:
        return candidates[0]

    sys.exit("psql not found. Add it to PATH or pass --psql <path to psql.exe>.")


class Db:
    """Runs SQL through psql against one database."""

    def __init__(self, psql: str, host: str, port: int, user: str, password: str):
        self.psql = psql
        self.host = host
        self.port = port
        self.user = user
        # Passed by environment rather than in the URL, so it stays out of the process list.
        self.env = {**os.environ, "PGPASSWORD": password}

    def query(self, database: str, sql: str) -> list[str]:
        """Rows as raw lines, tuples-only and unaligned so they can be read straight off."""
        result = subprocess.run(
            [self.psql, "-h", self.host, "-p", str(self.port), "-U", self.user,
             "-d", database, "-v", "ON_ERROR_STOP=1", "-At", "-c", sql],
            capture_output=True, text=True, env=self.env,
        )
        if result.returncode != 0:
            sys.exit(f"psql failed against {database}:\n{result.stderr.strip()}")
        return [line for line in result.stdout.splitlines() if line]

    def execute(self, database: str, sql: str) -> None:
        result = subprocess.run(
            [self.psql, "-h", self.host, "-p", str(self.port), "-U", self.user,
             "-d", database, "-v", "ON_ERROR_STOP=1", "-c", sql],
            capture_output=True, text=True, env=self.env,
        )
        if result.returncode != 0:
            sys.exit(f"psql failed against {database}:\n{result.stderr.strip()}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--email", required=True, help="the account whose database is emptied")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=5432)
    parser.add_argument("--user", default="postgres")
    parser.add_argument("--password", default="123", help="defaults to the local dev password")
    parser.add_argument("--master-db", default="master", help="database holding the Users table")
    parser.add_argument("--psql", help="path to psql.exe, if it is not on PATH")
    parser.add_argument("--keep", action="append", default=[], metavar="TABLE",
                        help="another table to leave alone; repeatable")
    parser.add_argument("--drop-catalogs", action="store_true",
                        help="also empty the seeded catalogs, leaving only the migration history")
    parser.add_argument("--yes", action="store_true", help="actually truncate; otherwise this is a dry run")
    parser.add_argument("--allow-remote", action="store_true",
                        help="permit a host other than localhost")
    args = parser.parse_args()

    # A wrong host here is unrecoverable, and production is one typo away from the default.
    if args.host not in ("localhost", "127.0.0.1") and not args.allow_remote:
        sys.exit(f"Refusing to touch {args.host} without --allow-remote.")

    db = Db(find_psql(args.psql), args.host, args.port, args.user, args.password)

    rows = db.query(args.master_db, f"select \"Id\" from \"Users\" where lower(\"Email\") = lower('{args.email}');")
    if not rows:
        sys.exit(f"No user with email {args.email} in {args.master_db} on {args.host}.")
    if len(rows) > 1:
        sys.exit(f"{len(rows)} users share that email; refusing to guess.")

    tenant = f"farm_user_{rows[0]}"
    if not db.query("postgres", f"select 1 from pg_database where datname = '{tenant}';"):
        sys.exit(f"Database {tenant} does not exist on {args.host}.")

    keep = {MIGRATIONS_TABLE, *args.keep}
    if not args.drop_catalogs:
        keep.update(SEEDED_CATALOGS)

    keep_list = ", ".join(f"'{name}'" for name in sorted(keep))
    targets = db.query(tenant, f"""
        select tablename from pg_tables
        where schemaname = 'public' and tablename not in ({keep_list})
        order by tablename;
    """)
    if not targets:
        sys.exit(f"Nothing to truncate in {tenant}.")

    print(f"database : {tenant} on {args.host}:{args.port}  ({args.email})")
    print(f"keeping  : {', '.join(sorted(keep))}")
    print(f"emptying : {len(targets)} tables")
    for name in targets:
        print(f"           {name}")

    if not args.yes:
        print("\nDry run. Re-run with --yes to truncate.")
        return

    # One statement, so it is one transaction: either every table is emptied or none is. CASCADE
    # covers tables referencing these, which is every child table and so already in the list;
    # the check afterwards confirms it reached nothing that was meant to be kept.
    table_list = ", ".join(f'"{name}"' for name in targets)
    db.execute(tenant, f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE;")
    print(f"\nTruncated {len(targets)} tables.")

    print("\nkept, after the fact:")
    for name in sorted(keep):
        count = db.query(tenant, f'select count(*) from "{name}";')[0]
        flag = "  <- emptied by CASCADE" if count == "0" and name != MIGRATIONS_TABLE else ""
        print(f"  {name}: {count}{flag}")


if __name__ == "__main__":
    main()
