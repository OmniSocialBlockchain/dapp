# OmniSocial Status Page

A real-time status page for monitoring OmniSocial services and components.

## Features

- Real-time service status monitoring
- Incident reporting and updates
- Service component breakdown
- Historical incident tracking
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Start production server:
```bash
npm start
```

## Configuration

The status page can be configured by modifying the services array in `src/pages/index.tsx`. Each service can have the following properties:

- `id`: Unique identifier for the service
- `name`: Display name of the service
- `status`: Current status (operational, degraded, outage, maintenance)
- `lastUpdated`: Timestamp of last status update
- `description`: Service description
- `updates`: Array of status updates

## Deployment

The status page can be deployed to any platform that supports Next.js applications, such as:

- Vercel
- Netlify
- AWS Amplify
- DigitalOcean App Platform

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 