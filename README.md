# SSH VPS Connector MCP Server

MCP сервер для SSH подключения к VPS с автоматизацией диагностики и мониторинга.

## Полная инструкция по установке и настройке

### 1. Установка

#### Клонирование репозитория
```bash
# Создайте директорию для MCP серверов (если не существует)
mkdir -p ~/.kiro/mcp-servers

# Перейдите в директорию
cd ~/.kiro/mcp-servers

# Клонируйте репозиторий
git clone https://github.com/pradigmaz/ssh-vps-connector.git

# Перейдите в директорию проекта
cd ssh-vps-connector
```

#### Установка зависимостей
```bash
# Установите зависимости
npm install

# Соберите проект
npm run build
```

**Рекомендуемый путь установки:** `~/.kiro/mcp-servers/ssh-vps-connector`

### 2. Создание SSH ключа

#### Генерация SSH ключа
```bash
# Создайте SSH ключ (если у вас его нет)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# При запросе пути к файлу, нажмите Enter для использования по умолчанию:
# /home/username/.ssh/id_rsa
```

#### Настройка прав доступа
```bash
# Установите правильные права доступа
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### 3. Настройка на VPS

#### Копирование публичного ключа на сервер

**Способ 1: Использование ssh-copy-id (рекомендуется)**
```bash
# Замените user и your-vps.com на ваши данные
ssh-copy-id user@your-vps.com
```

**Способ 2: Ручное копирование**
```bash
# Скопируйте содержимое публичного ключа
cat ~/.ssh/id_rsa.pub

# Подключитесь к VPS и добавьте ключ
ssh user@your-vps.com
mkdir -p ~/.ssh
echo "ваш_публичный_ключ" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit
```

#### Проверка подключения
```bash
# Проверьте подключение без пароля
ssh user@your-vps.com

# Если подключение успешно, выйдите
exit
```

### 4. Конфигурация MCP сервера

#### Настройка в Kiro CLI
Создайте или отредактируйте файл конфигурации Kiro CLI:

```bash
# Откройте файл конфигурации
nano ~/.kiro/config.json
```

Добавьте конфигурацию MCP сервера:

```json
{
  "mcpServers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["~/.kiro/mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa"
      }
    }
  }
}
```

#### Переменные окружения
Вы можете настроить следующие переменные:

- `SSH_HOST` - адрес вашего VPS
- `SSH_USERNAME` - имя пользователя для подключения
- `SSH_PRIVATE_KEY_PATH` - путь к приватному SSH ключу
- `SSH_PORT` - порт SSH (по умолчанию 22)

### 5. Проверка работы

#### Тестовая команда
```bash
# Перезапустите Kiro CLI для применения конфигурации
kiro-cli chat

# В чате попробуйте выполнить команду:
# "Проверь статус системы на VPS"
```

#### Troubleshooting

**Проблема: "Permission denied (publickey)"**
```bash
# Проверьте права доступа к ключам
ls -la ~/.ssh/
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

**Проблема: "Connection refused"**
```bash
# Проверьте, что SSH сервис запущен на VPS
ssh -v user@your-vps.com

# Проверьте правильность хоста и порта
ssh -p 22 user@your-vps.com
```

**Проблема: MCP сервер не запускается**
```bash
# Проверьте, что проект собран
cd ~/.kiro/mcp-servers/ssh-vps-connector
npm run build

# Проверьте логи Kiro CLI
kiro-cli --debug
```

**Проблема: "Module not found"**
```bash
# Переустановите зависимости
cd ~/.kiro/mcp-servers/ssh-vps-connector
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Конфигурация в Kiro CLI

### Аутентификация по SSH ключу

```json
{
  "mcpServers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["/home/zaikana/.kiro/mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "/home/user/.ssh/id_rsa"
      }
    }
  }
}
```

## Инструменты

### ssh_execute_command
Выполнение команд на VPS
- Блокирует деструктивные команды
- Логирует все операции
- Поддерживает аутентификацию по SSH ключу

### ssh_read_docker_logs
Чтение логов Docker контейнеров
- Параметр lines для количества строк

### ssh_check_service_status
Проверка статуса systemd сервисов

### ssh_monitor_resources
Мониторинг CPU/RAM/Disk

### ssh_list_containers
Список Docker контейнеров

## Безопасность

- Поддержка SSH ключей
- Блокировка деструктивных команд
- Валидация всех параметров с Zod
- Логирование операций

## Пример использования

```typescript
// Мониторинг ресурсов (используются переменные окружения)
await callTool('ssh_monitor_resources', {});

// Чтение логов с явными параметрами
await callTool('ssh_read_docker_logs', {
  host: 'your-vps.com',
  username: 'root',
  privateKeyPath: '/home/user/.ssh/id_rsa',
  containerName: 'nginx',
  lines: 50
});

// Использование SSH ключа
await callTool('ssh_execute_command', {
  host: 'your-vps.com',
  username: 'root',
  privateKeyPath: '/home/user/.ssh/id_rsa',
  command: 'docker ps'
});
```