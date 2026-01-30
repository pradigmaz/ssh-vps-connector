# SSH VPS Connector MCP Server

MCP сервер для SSH подключения к VPS с автоматизацией диагностики и мониторинга.

**Совместим с Claude Desktop, Cursor, Cline, Kiro CLI и другими MCP клиентами**

## Новые возможности

### Автоматический сбор данных VPS
При первом подключении сервер автоматически собирает:
- Список всех Docker контейнеров
- Credentials для PostgreSQL, Redis, MongoDB из переменных окружения
- Порты и конфигурации всех сервисов
- Структуру docker-compose файлов
- Конфигурацию сети

Данные сохраняются в `.ai/vps-config.json` и используются для последующих операций.

### Новые инструменты
- `ssh_refresh_vps_data` - обновить собранные данные
- `ssh_get_vps_config` - получить кэшированную конфигурацию VPS

## Полная инструкция по установке и настройке

### 1. Установка

#### Linux

##### Клонирование репозитория
```bash
# Создайте директорию для MCP серверов (если не существует)
mkdir -p ~/.mcp-servers

# Перейдите в директорию
cd ~/.mcp-servers

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

**Рекомендуемый путь установки:** `~/.mcp-servers/ssh-vps-connector`

#### Windows

**Требования:** OpenSSH для Windows (встроен в Windows 10/11 или установите через Settings > Apps > Optional Features)

##### Клонирование репозитория
```cmd
REM Создайте директорию для MCP серверов (если не существует)
mkdir %USERPROFILE%\.mcp-servers

REM Перейдите в директорию
cd %USERPROFILE%\.mcp-servers

REM Клонируйте репозиторий
git clone https://github.com/pradigmaz/ssh-vps-connector.git

REM Перейдите в директорию проекта
cd ssh-vps-connector
```

##### Установка зависимостей
```cmd
REM Установите зависимости
npm install

REM Соберите проект
npm run build
```

**Рекомендуемый путь установки:** `%USERPROFILE%\.mcp-servers\ssh-vps-connector`

### 2. Создание SSH ключа

#### Linux

##### Генерация SSH ключа
```bash
# Создайте SSH ключ (если у вас его нет)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# При запросе пути к файлу, нажмите Enter для использования по умолчанию:
# /home/username/.ssh/id_rsa
```

##### Настройка прав доступа
```bash
# Установите правильные права доступа
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

#### Windows

##### Генерация SSH ключа
```cmd
REM Создайте SSH ключ (если у вас его нет)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

REM При запросе пути к файлу, нажмите Enter для использования по умолчанию:
REM C:\Users\username\.ssh\id_rsa
```

##### Настройка прав доступа
```cmd
REM Установите правильные права доступа
icacls %USERPROFILE%\.ssh /inheritance:r
icacls %USERPROFILE%\.ssh /grant:r %USERNAME%:(F)
icacls %USERPROFILE%\.ssh\id_rsa /inheritance:r
icacls %USERPROFILE%\.ssh\id_rsa /grant:r %USERNAME%:(R)
```

### 3. Настройка на VPS

#### Копирование публичного ключа на сервер

**Способ 1: Использование ssh-copy-id (Linux)**
```bash
# Замените user и your-vps.com на ваши данные
ssh-copy-id user@your-vps.com
```

**Способ 1: Ручное копирование (Windows)**
```cmd
REM Скопируйте содержимое публичного ключа
type %USERPROFILE%\.ssh\id_rsa.pub | ssh user@your-vps.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Способ 2: Ручное копирование (Linux)**
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

**Способ 2: Ручное копирование (Windows)**
```cmd
REM Скопируйте содержимое публичного ключа
type %USERPROFILE%\.ssh\id_rsa.pub

REM Подключитесь к VPS и добавьте ключ
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

### 4. Конфигурация MCP клиента

#### Claude Desktop

**Linux:**
```bash
# Откройте файл конфигурации
nano ~/.config/claude/claude_desktop_config.json
```

**Windows:**
```cmd
REM Откройте файл конфигурации
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Конфигурация:**
```json
{
  "mcpServers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["~/.mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa",
        "SSH_PORT": "22"
      }
    }
  }
}
```

#### Cursor

Откройте настройки Cursor (Ctrl+,) и добавьте в settings.json:

```json
{
  "mcp.servers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["~/.mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa",
        "SSH_PORT": "22"
      }
    }
  }
}
```

#### Cline

В настройках MCP добавьте:

```json
{
  "mcpServers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["~/.mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa",
        "SSH_PORT": "22"
      }
    }
  }
}
```

#### Kiro CLI

**Linux:**
```bash
# Откройте файл конфигурации
nano ~/.kiro/config.json
```

**Windows:**
```cmd
REM Откройте файл конфигурации
notepad %USERPROFILE%\.kiro\config.json
```

**Конфигурация:**
```json
{
  "mcpServers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["~/.mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa",
        "SSH_PORT": "22"
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
# Перезапустите ваш MCP клиент для применения конфигурации
# Запустите ваш MCP клиент

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
cd ~/.mcp-servers/ssh-vps-connector
npm run build

# Проверьте логи вашего MCP клиента
```

**Проблема: "Module not found"**
```bash
# Переустановите зависимости
cd ~/.mcp-servers/ssh-vps-connector
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
      "args": ["/home/user/.mcp-servers/ssh-vps-connector/dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "/home/user/.ssh/id_rsa",
        "SSH_PORT": "22"
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