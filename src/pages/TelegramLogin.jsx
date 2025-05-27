import React, { useEffect } from 'react';

export default function TelegramLogin({ user, onTelegramAuth, handleLogout }) {
  useEffect(() => {
    // Динамически подгружаем скрипт Telegram Login Widget
    const scriptId = 'telegram-login-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://telegram.org/js/telegram-widget.js?15';
      script.setAttribute('data-telegram-login', 'zavod_worker_bot'); // <-- Заменить на юзернейм твоего бота
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-auth-url', ''); // Не использовать, т.к. мы принимаем через callback
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-lang', 'ru');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)'); // Передаем колбэк
      script.async = true;

      document.getElementById('telegram-button').appendChild(script);
    }
  }, []);

  return (
    <div style={{ maxWidth: 320, margin: 'auto', textAlign: 'center' }}>
      {user ? (
        <>
          <h2>Привет, {user.username || user.first_name}!</h2>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#ff5e7e',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Выйти
          </button>
        </>
      ) : (
        <>
          <h1>Войти в аккаунт</h1>
          <p>Авторизуйтесь через Telegram, чтобы сохранить ваши истории и изображения.</p>
          <div id="telegram-button" style={{ marginTop: '20px' }}></div>
        </>
      )}
    </div>
  );
}
