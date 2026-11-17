'use client';

import { useState } from 'react';

type Props = { images: string[]; title: string };

export default function Gallery({ images, title }: Props) {
  const list = images.length ? images : ['/img/hero.jpg'];
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0];

  return (
    <div className="gallery">
      <div className="gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={`${title} — photo ${active + 1}`} width={1280} height={840} />
      </div>
      {list.length > 1 && (
        <div className="gallery-thumbs" role="tablist" aria-label="Photos">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Photo ${i + 1}`}
              className={`thumb${i === active ? ' thumb-active' : ''}`}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" width={160} height={110} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
