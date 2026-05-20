# NutriZen 🌿
[![Flutter & Supabase Build](https://github.com/sabelfeldivanthebest2011/NutriZen/actions/workflows/flutter.yml/badge.svg)](https://github.com/sabelfeldivanthebest2011/NutriZen/actions/workflows/flutter.yml)

> Instantly track metabolic cycles, configure meal schedules, view macro metrics, and achieve dietary targets safely with a high-performance system powered by FlutterFlow and Supabase.

---

## 📖 About NutriZen
**NutriZen** is an advanced weight and nutrition tracker engineered to simplify meal logs, establish precision weight metrics, and synchronize body indicators smoothly. Built with **FlutterFlow** as the responsive mobile visual layer and **Supabase** as the high-availability real-time server database, NutriZen supports automatic calculations, precise step snapping, custom daily protein margins, and secure user logins.

---

## 🚀 Architectural Stack
- **Frontend Core**: [FlutterFlow](https://flutterflow.io/) & [Flutter](https://flutter.dev/) (Cross-platform iOS, Android, and Web experience).
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (Secure Auth, Postgres relational profiles, real-time subscriptions, secure RLS rules).
- **CI/CD Integration**: [GitHub Actions](https://github.com/features/actions) automates application verification, builds, and standard pipeline testing.

---

## ⚙️ Quick Start & Local Setup

### Prerequisite Checklist
Make sure you have installed:
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (Stable channel, matching your target platform)
- Dart SDK
- Android Studio / Xcode (for localized device running)

### Setup Guidelines

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sabelfeldivanthebest2011/NutriZen.git
   cd NutriZen
   ```

2. **Initialize Local Configuration**:
   The app excludes secrets and credentials from the public directory. Create your local configuration file by duplicating the provided environment example template:
   ```bash
   cp .env.example .env
   ```

3. **Configure API Credentials**:
   Open `.env` in your workspace and specify your actual **Supabase API URL** and **Anonymous Public Key**:
   ```env
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-supabase-public-anon-key-here"
   ```

4. **Install App Dependencies**:
   Retrieve required packages for compiling:
   ```bash
   flutter pub get
   ```

5. **Run App Locally**:
   ```bash
   flutter run
   ```

---

## 🤖 GitHub Actions Workflow
The target repository includes a GitHub Actions configuration at `.github/workflows/flutter.yml` to automatically verify, test, and build the Flutter binary upon each push to the `main` branch.

### Configuration Template (`.github/workflows/flutter.yml`):
```yaml
name: Flutter Build & Check

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Checkout the code
      - name: Checkout repository
        uses: actions/checkout@v4

      # Step 2: Set up Java Environment (Android support)
      - name: Set up Java Development Kit (JDK)
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'

      # Step 3: Set up Flutter
      - name: Set up Flutter SDK
        uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
          # Alternatively, specify a version matching your pubspec:
          # flutter-version: '3.19.x'

      # Step 4: Cache Flutter dependencies
      - name: Cache pub dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.pub-cache
            ${{ env.PUB_CACHE }}
          key: ${{ runner.os }}-pub-${{ hashFiles('**/pubspec.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pub-

      # Step 5: Install dependencies
      - name: Install dependencies
        run: flutter pub get

      # Step 6: Verify syntax and lint code
      - name: Analyze code syntax
        run: flutter analyze

      # Step 7: Run unit/integration tests
      - name: Run unit testing
        run: flutter test

      # Step 8: Assemble Release build for Android
      - name: Compile APK Release binary
        run: flutter build apk --release
```

---

## 🛡️ Critical Security Advice
It is highly recommended to follow these guidelines to guard credentials against public Git disclosures:

1. **Verify Your `.gitignore`**:
   Ensure `.env` and local secrets documents are listed in your `.gitignore` before making any staging changes. Always avoid staging entire file folders blindly using `git add .` without first examining changed paths:
   ```bash
   git status  # Always verify files that are ready to commit!
   ```

2. **Clean Historical Commits**:
   If credentials (such as Supabase keys) were already committed to the local history, changing `.gitignore` **will not remove them** from the historical logs. Use target rewrite tools like `git-filter-repo` or [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to completely strip them out of all branch histories.

3. **Active Secret Scans**:
   Connect tools like [TruffleHog](https://github.com/trufflesecurity/trufflehog) or [GitGuardian](https://www.gitguardian.com/) to your repository to receive real-time, automated checks whenever secrets are accidentally pushed.

4. **Inject Credentials in CI via Secrets**:
   Never write raw passwords or API keys within `.yml` actions. Always inject them using **GitHub Repository Secrets** and refer to them as environment contexts:
   - Go to: `Settings > Secrets and variables > Actions > New repository secret`.
   - Access safely in actions: `${{ secrets.SUPABASE_ANON_KEY }}`.

---

## 📄 License
This application is distributed under the standard MIT License. View [LICENSE](LICENSE) for more terms and conditions.
