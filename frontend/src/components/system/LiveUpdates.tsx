'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSocket } from '@/realtime/socket';
import { reloadOrders } from '@/store/ordersSlice';
import { refreshProducts } from '@/store/productsSlice';
import { useAppDispatch } from '@/store/hooks';

// Event-Driven Architecture на стороне браузера: сервер сообщает «что-то изменилось» (событие domain-event),
// а эта невидимая подписка обновляет данные на открытой странице. Опроса сервера по таймеру нет.
export default function LiveUpdates() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    let timer: ReturnType<typeof setTimeout>;
    const onEvent = () => {
      clearTimeout(timer);
      // Несколько событий подряд склеиваем в одно обновление (debounce 150 мс)
      timer = setTimeout(() => {
        if (pathname.startsWith('/orders')) dispatch(reloadOrders());
        else if (pathname.startsWith('/products')) dispatch(refreshProducts());
        else if (pathname.startsWith('/stats') || pathname.startsWith('/map')) router.refresh(); // эти страницы получают данные от сервера
      }, 150);
    };
    socket.on('domain-event', onEvent);
    return () => { clearTimeout(timer); socket.off('domain-event', onEvent); };
  }, [dispatch, router, pathname]);

  return null;
}
