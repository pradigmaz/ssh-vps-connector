# SSH VPS Connector MCP Server

MCP сервер для SSH подключения к VPS с автоматизацией диагностики и мониторинга. Автоматически собирает данные о Docker контейнерах, базах данных и сервисах при первом подключении.

## Быстрый старт

1. **Установка**
   ```bash
   git clone https://github.com/pradigmaz/ssh-vps-connector.git
   cd ssh-vps-connector
   npm install && npm run build
   ```

2. **Настройка SSH ключа**
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id user@your-vps.com
   ```

3. **Добавить в mcp.json**
   ```json
   {
     "mcpServers": {
       "ssh-vps-connector": {
         "command": "node",
         "args": ["./dist/index.js"],
         "env": {
           "SSH_HOST": "your-vps.com",
           "SSH_USERNAME": "root",
           "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa"
         }
       }
     }
   }
   ```

## Конфигурация

```json
{
  "mcpServers": {
    "ssh-vps-connector": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "SSH_HOST": "your-vps.com",
        "SSH_USERNAME": "root",
        "SSH_PRIVATE_KEY_PATH": "~/.ssh/id_rsa",
        "SSH_PORT": "22",
        "ALLOWED_COMMANDS": "ls,cat,docker ps,docker logs",
        "ALLOWED_DIRECTORIES": "/var/www,/opt/app"
      }
    }
  }
}
```

## Настройка безопасности

### Базовый доступ (только чтение)
```json
"ALLOWED_COMMANDS": "ls,cat,grep,ps,docker ps,docker logs"
```

### Расширенный доступ (управление Docker)
```json
"ALLOWED_COMMANDS": "ls,cat,docker ps,docker logs,docker start,docker stop,docker restart"
```

### Ограничение директорий
```json
"ALLOWED_DIRECTORIES": "/var/www,/home/user/projects,/opt/app"
```

## Инструменты

- `ssh_execute_command` - выполнение команд на VPS
- `ssh_read_docker_logs` - чтение логов Docker контейнеров
- `ssh_check_service_status` - проверка статуса systemd сервисов
- `ssh_monitor_resources` - мониторинг CPU/RAM/Disk
- `ssh_list_containers` - список Docker контейнеров
- `ssh_refresh_vps_data` - обновить собранные данные VPS
- `ssh_get_vps_config` - получить кэшированную конфигурацию VPS

## Документация

- [INSTALLATION.md](./INSTALLATION.md) - подробная инструкция по установке
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - решение проблем
- [COMMANDS_DICTIONARY.md](./COMMANDS_DICTIONARY.md) - словарь команд

## Безопасность

- Аутентификация по SSH ключам
- Блокировка деструктивных команд
- Защита от command injection
- Ограничение доступа к директориям
- Timeout для всех операций
- Логирование всех действий