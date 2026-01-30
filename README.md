# SSH VPS Connector MCP Server

MCP сервер для SSH подключения к VPS с автоматизацией диагностики и мониторинга.

## Установка

```bash
cd /home/zaikana/.kiro/mcp-servers/ssh-vps-connector
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