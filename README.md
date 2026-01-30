# SSH VPS Connector MCP Server

MCP сервер для SSH подключения к VPS с автоматизацией диагностики и мониторинга.

**Совместим с Claude Desktop, Cursor, Cline и другими MCP клиентами**

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

#### Другие MCP клиенты

Для других MCP клиентов найдите конфигурационный файл в документации вашего клиента и добавьте:

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

## Настройка безопасности

### Whitelist команд (ALLOWED_COMMANDS)

По умолчанию MCP сервер блокирует ВСЕ команды для безопасности.

**Как работает:**
- Пустой `ALLOWED_COMMANDS` = ничего нельзя (только подключение к VPS)
- Указаны команды = можно выполнять ТОЛЬКО эти команды

**Примеры конфигурации:**

#### Базовый доступ (только чтение)
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
        "ALLOWED_COMMANDS": "ls,cat,grep,ps,docker ps,docker logs"
      }
    }
  }
}
```

#### Расширенный доступ (чтение + управление Docker)
```json
"ALLOWED_COMMANDS": "ls,cat,grep,ps,docker ps,docker logs,docker start,docker stop,docker restart"
```

#### Полный доступ (всё кроме опасного)
```json
"ALLOWED_COMMANDS": "ls,cat,grep,ps,docker,systemctl,mkdir,cp,mv"
```

### Whitelist директорий (ALLOWED_DIRECTORIES)

Ограничивает работу только с определёнными папками.

**Пример:**
```json
"ALLOWED_DIRECTORIES": "/var/www,/home/user/projects,/opt/app"
```

- Пустой = любые папки разрешены
- Указаны папки = работа только в этих папках

### Полный пример конфигурации

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
        "SSH_PORT": "22",
        "ALLOWED_COMMANDS": "ls,cat,docker ps,docker logs,docker restart",
        "ALLOWED_DIRECTORIES": "/var/www,/opt/app"
      }
    }
  }
}
```

### Словарь команд

Полный список команд с описаниями смотри в [COMMANDS_DICTIONARY.md](./COMMANDS_DICTIONARY.md)

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

## Дополнительная защита

### Command Injection Protection
Сервер автоматически блокирует опасные символы в командах:
- `;` - разделитель команд
- `|` - пайп (кроме разрешённых случаев)
- `&` - фоновое выполнение
- `$` - подстановка переменных
- `` ` `` - выполнение команд
- `>` `<` - перенаправление (кроме разрешённых)

**Пример блокировки:**
```bash
# Заблокировано
ls; rm -rf /
cat file | sh
echo $PASSWORD

# Разрешено
ls -la
docker ps | grep nginx
```

### Privileged Operations Block
Автоматически блокируются привилегированные операции:
- `sudo` - выполнение от имени root
- `su` - смена пользователя
- `passwd` - смена паролей
- `useradd/userdel` - управление пользователями
- `mount/umount` - монтирование дисков

### Dangerous Subcommands Block
Блокируются опасные подкоманды даже если основная команда разрешена:
- `rm -rf` - рекурсивное удаление
- `chmod 777` - открытие всех прав
- `dd if=/dev/zero` - затирание дисков
- `:(){ :|:& };:` - fork bomb

### Path Traversal Protection
Защита от выхода за пределы разрешённых директорий:
- `../../../etc/passwd` - заблокировано
- `~/../.ssh/` - заблокировано
- Абсолютные пути проверяются против ALLOWED_DIRECTORIES

### Timeout Protection
- Все команды имеют timeout 5 секунд
- Предотвращает зависание на долгих операциях
- Автоматическое завершение зависших процессов

### Security Logging
Все попытки обхода безопасности логируются:
- Заблокированные команды
- Попытки command injection
- Нарушения path traversal
- Превышение timeout

### Рекомендации по безопасности

#### Минимальные права
Используйте отдельного пользователя для SSH подключений:
```bash
# Создайте пользователя для MCP
sudo useradd -m -s /bin/bash mcpuser
sudo usermod -aG docker mcpuser  # если нужен Docker

# Настройте SSH ключ для этого пользователя
sudo -u mcpuser ssh-keygen -t rsa -b 4096
```

#### Ограничение команд
Начните с минимального набора команд:
```json
"ALLOWED_COMMANDS": "ls,cat,ps,docker ps,docker logs"
```

#### Ограничение директорий
Ограничьте доступ только к рабочим папкам:
```json
"ALLOWED_DIRECTORIES": "/var/www,/opt/app,/home/mcpuser"
```

#### Мониторинг
Регулярно проверяйте логи на подозрительную активность:
```bash
# Проверка логов MCP сервера
journalctl -u your-mcp-service | grep "SECURITY"
```

#### Сетевая безопасность
- Используйте нестандартный SSH порт
- Настройте fail2ban для защиты от брутфорса
- Ограничьте SSH доступ по IP адресам

## Пример использования

```typescript
// Мониторинг ресурсов (используются переменные окружения)
await callTool('ssh_monitor_resources', {});

// Чтение логов с явными параметрами
await callTool('ssh_read_docker_logs', {
  host: 'your-vps.com',
  username: 'root',
  privateKeyPath: '~/.ssh/id_rsa',
  containerName: 'nginx',
  lines: 50
});

// Использование SSH ключа
await callTool('ssh_execute_command', {
  host: 'your-vps.com',
  username: 'root',
  privateKeyPath: '~/.ssh/id_rsa',
  command: 'docker ps'
});
```