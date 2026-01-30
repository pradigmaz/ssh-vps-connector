# Устранение неполадок SSH VPS Connector

## Permission denied (publickey)

**Проблема:** Ошибка аутентификации при подключении к VPS

**Решение:**
```bash
# Проверьте права доступа к ключам
ls -la ~/.ssh/
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Убедитесь, что публичный ключ добавлен на VPS
cat ~/.ssh/id_rsa.pub
# Скопируйте содержимое и добавьте в ~/.ssh/authorized_keys на VPS
```

## Connection refused

**Проблема:** Не удается подключиться к VPS

**Решение:**
```bash
# Проверьте, что SSH сервис запущен на VPS
ssh -v user@your-vps.com

# Проверьте правильность хоста и порта
ssh -p 22 user@your-vps.com

# Проверьте доступность хоста
ping your-vps.com

# Проверьте, что порт SSH открыт
telnet your-vps.com 22
```

## Module not found

**Проблема:** MCP сервер не может найти модули Node.js

**Решение:**
```bash
# Переустановите зависимости
cd ~/.mcp-servers/ssh-vps-connector
rm -rf node_modules package-lock.json
npm install
npm run build

# Проверьте версию Node.js (требуется 16+)
node --version
```

## MCP сервер не запускается

**Проблема:** Сервер не инициализируется в MCP клиенте

**Решение:**
```bash
# Проверьте, что проект собран
cd ~/.mcp-servers/ssh-vps-connector
npm run build

# Проверьте конфигурацию в claude_desktop_config.json
# Убедитесь, что пути указаны правильно

# Проверьте логи вашего MCP клиента
# Для Claude Desktop: ~/.config/claude/logs/

# Тестовый запуск сервера
node dist/index.js
```

## Дополнительная диагностика

### Проверка SSH подключения
```bash
# Подробная диагностика SSH
ssh -vvv user@your-vps.com

# Проверка конфигурации SSH
cat ~/.ssh/config
```

### Проверка переменных окружения
```bash
# Убедитесь, что все переменные заданы правильно:
# SSH_HOST, SSH_USERNAME, SSH_PRIVATE_KEY_PATH, SSH_PORT
echo $SSH_HOST
```

### Проверка прав доступа (Linux)
```bash
# Права на директорию .ssh
ls -ld ~/.ssh
# Должно быть: drwx------

# Права на приватный ключ
ls -l ~/.ssh/id_rsa
# Должно быть: -rw-------

# Права на публичный ключ
ls -l ~/.ssh/id_rsa.pub
# Должно быть: -rw-r--r--
```