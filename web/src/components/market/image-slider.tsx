import { useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/misc-icons';
import './image-slider.css';

type Props = {
  images: string[];
};

/** The frame is a fixed 16:9 box sized by CSS — see image-slider.css. */
export function ImageSlider({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    setActiveIndex((index + images.length) % images.length);
  }

  return (
    <div className="image-slider">
      <img src={images[activeIndex]} alt="" className="image-slider-img" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="image-slider-arrow image-slider-arrow-prev"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous image"
          >
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <button
            type="button"
            className="image-slider-arrow image-slider-arrow-next"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next image"
          >
            <ChevronRightIcon width={18} height={18} />
          </button>

          <div className="image-slider-dots">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === activeIndex ? 'image-slider-dot active' : 'image-slider-dot'}
                onClick={() => goTo(index)}
                aria-label={`Image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
