# Setup para MacBook Pro M4

Guía rápida para configurar el entorno de desarrollo de Stokk.

## 1. Herramientas Base

```bash
# Instalar Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Agregar Homebrew al PATH (importante en Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Instalar Node.js (LTS) y Watchman
brew install node watchman

# Instalar Git (si no está instalado)
brew install git
```

## 2. Xcode (para iOS)

```bash
# Instalar Xcode desde App Store o:
xcode-select --install

# Aceptar licencia
sudo xcodebuild -license accept

# Instalar CocoaPods
sudo gem install cocoapods
```

## 3. Android Studio (para Android)

1. Descargar desde https://developer.android.com/studio
2. Instalar y abrir Android Studio
3. Ir a **Settings > Languages & Frameworks > Android SDK**
4. Instalar:
   - Android SDK Platform 34
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

5. Agregar al `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 4. Proyecto

```bash
# Clonar repositorio
git clone <repo-url>
cd stokk

# Instalar dependencias
npm install

# Instalar EAS CLI (para builds)
npm install -g eas-cli

# Login en Expo (opcional)
npx expo login
```

## 5. Configuración de Entorno

Crear archivo `.env` en la raíz (si aplica):
```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=tu_api_key
```

## 6. Ejecutar la App

```bash
# Primera vez: compilar la app nativa
npx expo run:ios      # iOS
npx expo run:android  # Android

# Desarrollo posterior
npm run start
```

## Verificar Instalación

```bash
node --version    # v18+ recomendado
npm --version     # v9+
git --version
pod --version     # CocoaPods
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run start` | Servidor de desarrollo |
| `npm run ios` | Ejecutar en iOS |
| `npm run android` | Ejecutar en Android |
| `npm run lint` | Verificar código |
| `npm run test` | Ejecutar tests |
| `npm run type-check` | Verificar tipos |
