import './visit-flag.css';

type Props = {
  code: string;
};

export function VisitFlag({ code }: Props) {
  if (!/^[a-z]{2}$/i.test(code)) return null;
  return (
    <img
      className="visitors-flag"
      src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
      alt=""
      loading="lazy"
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
    />
  );
}
