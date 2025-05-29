import { useEffect, useState } from 'react'; 

function TelegramLogin() {
  const [user, setUser] = useState(() => {
    // Попытка загрузить пользователя из localStorage при инициализации
    const saved = localStorage.getItem('telegramUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    window.onTelegramAuth = function(user) {
      console.log('Telegram user:', user);
      setUser(user);
      localStorage.setItem('telegramUser', JSON.stringify(user));

      fetch('http://194.87.131.112:8000/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      })
        .then(res => res.json())
        .then(data => {
          console.log('Ответ от сервера:', data);
          setError(null);
        })
        .catch(err => {
          console.error('Ошибка при отправке на сервер:', err);
          setError('Ошибка при сохранении пользователя на сервере');
        });
    };

    if (!user) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?7';
      script.setAttribute('data-telegram-login', 'zavod_worker_bot'); // замени на своего бота
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-lang', 'ru');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;

      const widgetContainer = document.getElementById('telegram-button');
      if (widgetContainer) {
        widgetContainer.innerHTML = '';
        widgetContainer.appendChild(script);
      }
    }
  }, [user]);

  function logout() {
    setUser(null);
    setError(null);
    localStorage.removeItem('telegramUser');
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Вход через Telegram</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user ? (
        <div>
          <p>Вы вошли как: <b>{user.first_name || user.username || 'Пользователь'}</b></p>
          {user.photo_url && (
            <img
              src={user.photo_url}
              alt="avatar"
              style={{ borderRadius: '50%', width: 80, height: 80, marginBottom: 10 }}
            />
          )}
          <button onClick={logout} style={styles.logoutButton}>Выйти</button>
        </div>
      ) : (
        <div id="telegram-button"></div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: '"Comic Neue", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(to right, #fcb1e2, #b49fef)',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#333',
  },
  logoutButton: {
    padding: '10px 25px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#9b59b6',
    color: 'white',
    cursor: 'pointer',
  },
};

export default TelegramLogin;
