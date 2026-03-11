// Простая реализация событий для оповещения об истечении сеанса
const listeners = [];

export const authEvents = {
  // Подписка на событие
  onUnauthorized: (callback) => {
    listeners.push(callback);
    // Возвращаем функцию отписки
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) listeners.splice(index, 1);
    };
  },
  // Вызов события (например, при получении 401)
  triggerUnauthorized: () => {
    listeners.forEach(callback => callback());
  }
};