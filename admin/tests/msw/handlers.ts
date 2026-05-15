import { http, HttpResponse } from 'msw';

// Дефолтные обработчики пусты — каждый suite определяет нужные ему responses
// через server.use(...). Здесь оставим только заготовку для редко используемых маршрутов.
export const handlers = [http.post('http://localhost/auth/v1/logout', () => HttpResponse.json({}))];
