// loading="lazy" — браузер загружает картинку, только когда она приближается к экрану (Lazy Loading)
export default function ProductThumb({ photo }: { photo: string }) {
  const src = /^[\w-]+\.svg$/.test(photo) ? `/img/${photo}` : '/img/monitor.svg';
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="thumb" src={src} alt="" width={48} height={40} loading="lazy" />;
}
