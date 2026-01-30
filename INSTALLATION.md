# Установка SSH VPS Connector

## 1. Установка зависимостей

### Linux

```bash
# Создайте директорию для MCP серверов (если не существует)
mkdir -p ~/.mcp-servers

# Перейдите в директорию
cd ~/.mcp-servers

# Клонируйте репозиторий
git clone https://github.com/pradigmaz/ssh-vps-connector.git

# Перейдите в директорию проекта
cd ssh-vps-connector

# Установите зависимости
npm install

# Соберите проект
npm run build
```

### Windows

**Требования:** OpenSSH для Windows (встроен в Windows 10/11 или установите через Settings > Apps > Optional Features)

```cmd
REM Создайте директорию для MCP серверов (если не существует)
mkdir %USERPROFILE%\.mcp-servers

REM Перейдите в директорию
cd %USERPROFILE%\.mcp-servers

REM Клонируйте репозиторий
git clone https://github.com/pradigmaz/ssh-vps-connector.git

REM Перейдите в директорию проекта
cd ssh-vps-connector

REM Установите зависимости
npm install

REM Соберите проект
npm run build
```

## 2. Создание SSH ключа

### Linux

```bash
# Создайте SSH ключ (если у вас его нет)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# При запросе пути к файлу, нажмите Enter для использования по умолчанию:
# /home/username/.ssh/id_rsa

# Установите правильные права доступа
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### Windows

```cmd
REM Создайте SSH ключ (если у вас его нет)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

REM При запросе пути к файлу, нажмите Enter для использования по умолчанию:
REM C:\Users\username\.ssh\id_rsa

REM Установите правильные права доступа
icacls %USERPROFILE%\.ssh /inheritance:r
icacls %USERPROFILE%\.ssh /grant:r %USERNAME%:(F)
icacls %USERPROFILE%\.ssh\id_rsa /inheritance:r
icacls %USERPROFILE%\.ssh\id_rsa /grant:r %USERNAME%:(R)
```

## 3. Настройка на VPS

### Копирование публичного ключа на сервер

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

### Проверка подключения
```bash
# Проверьте подключение без пароля
ssh user@your-vps.com

# Если подключение успешно, выйдите
exit
```