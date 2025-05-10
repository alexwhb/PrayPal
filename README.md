# PrayPal

<p align="center">
  <!-- Replace with actual logo if available -->
  <img src="public/logo.svg" alt="PrayPal Logo" width="200" />
</p>

<p align="center">
  <a href="https://github.com/alexwhb/praypal/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License: Apache 2.0">
  </a>
  <a href="https://github.com/alexwhb/praypal/stargazers">
    <img src="https://img.shields.io/github/stars/alexwhb/praypal" alt="GitHub stars">
  </a>
  <a href="https://github.com/alexwhb/praypal/issues">
    <img src="https://img.shields.io/github/issues/alexwhb/praypal" alt="GitHub issues">
  </a>
  <a href="https://github.com/alexwhb/praypal/network/members">
    <img src="https://img.shields.io/github/forks/alexwhb/praypal" alt="GitHub forks">
  </a>
</p>

<p align="center">
  A digital platform for church communities to connect, share, and support one another
</p>

## 📖 Overview

PrayPal is a comprehensive web application designed to strengthen church communities by facilitating connection, sharing, and mutual support among members. It provides a digital space where church members can share prayer requests, offer items to others, express needs, form groups, and connect with one another in meaningful ways.

Built with modern web technologies and designed with church communities in mind, PrayPal aims to extend the sense of community beyond physical gatherings and enable members to support one another throughout the week.

## 🚀 Features

### Prayer Board
- **Share Prayer Requests**: Members can share prayer requests with the community
- **Pray for Others**: Indicate when you've prayed for someone's request
- **Answered Prayers**: Mark prayers as answered and share testimonies
- **Categorization**: Organize prayers by categories for easy navigation

### Community Needs
- **Express Needs**: Members can share their needs with the community
- **Fulfill Needs**: Others can respond to and fulfill expressed needs
- **Categorization**: Browse needs by category
- **Status Tracking**: Mark needs as fulfilled when resolved

### Sharing Economy
- **Give Items**: Offer items to give away to others in the community
- **Borrow Items**: Share items that others can borrow temporarily
- **Item Management**: Track claimed and available items
- **Direct Messaging**: Connect with item owners through the messaging system

### Groups
- **Create Groups**: Form interest-based, ministry, or study groups
- **Join Requests**: Request to join private groups
- **Group Management**: Leaders can manage members and group settings
- **Group Categories**: Browse groups by category

### Church Mixer
- **Social Connections**: Connect with other church members for social activities
- **Profile Creation**: Create profiles with preferences for social activities
- **Matching System**: Get matched with compatible members for fellowship

### Messaging
- **Direct Messages**: Private conversations between members
- **Group Conversations**: Chat with multiple members at once
- **Attachments**: Share content from other parts of the platform in messages
- **Notifications**: Get notified of new messages

### User Profiles
- **Member Profiles**: View information about other church members
- **Prayer History**: See prayer requests and answered prayers
- **Activity Feed**: View recent activity and contributions

### Moderation
- **Content Moderation**: Admin tools to ensure appropriate content
- **Reporting System**: Report inappropriate content for review
- **User Management**: Admin controls for user accounts

## 🛠️ Tech Stack

PrayPal is built on the [Epic Stack](https://github.com/epicweb-dev/epic-stack), providing a solid foundation with:

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) (based on Radix UI)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Built-in auth with email/password and social providers
- **Deployment**: Fly.io
- **Real-time**: WebSockets for real-time features
- **Testing**: Playwright for E2E tests, Vitest for unit tests

## 📋 Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL (or SQLite for development)

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/praypal.git
   cd praypal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Set up the database:
   ```bash
   npm run setup
   ```

### Development

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Testing

Run tests:
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:e2e:dev  # Run end-to-end tests with UI
```

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## 🐳 Docker

PrayPal can be deployed using Docker:

```bash
# Build the Docker image
docker build -t praypal -f other/Dockerfile .

# Run the container
docker run -p 8080:8080 -e DATABASE_URL=postgresql://user:password@host:port/database praypal
```

## 🚢 Deployment

PrayPal is configured for deployment on [Fly.io](https://fly.io):

```bash
fly launch
```

For other platforms, see the [deployment documentation](docs/deployment.md).

## 🧩 Project Structure

```
praypal/
├── app/                  # Application code
│   ├── components/       # React components
│   │   ├── prayer/       # Prayer-related components
│   │   ├── needs/        # Needs-related components
│   │   ├── shared/       # Shared item components
│   │   ├── groups/       # Group-related components
│   │   └── ...
│   ├── routes/           # Route components
│   │   ├── _app+/        # Main app routes
│   │   │   ├── _prayer+/ # Prayer board routes
│   │   │   ├── _needs+/  # Needs board routes
│   │   │   ├── _sharable+/ # Sharing routes
│   │   │   ├── _groups+/ # Group routes
│   │   │   ├── _mixer+/  # Mixer routes
│   │   │   └── ...
│   │   ├── _admin+/      # Admin routes
│   │   └── ...
│   ├── utils/            # Utility functions
│   └── ...
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── tests/                # Test files
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Epic Stack](https://github.com/epicweb-dev/epic-stack) - The foundation of this project
- [Shadcn/UI](https://ui.shadcn.com/) - For the beautiful UI components
- All our [contributors](https://github.com/your-username/praypal/graphs/contributors)

## ☕ Support

If you find this project helpful, please consider supporting its development:

<a href="https://www.buymeacoffee.com/alex.black">
  <img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" >
</a>

## 📬 Contact

If you have any questions or feedback, please open an issue or reach out to the maintainers.

---

<p align="center">
  Made with ❤️ by Alex Black
</p>