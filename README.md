# Rhythm&Strings Song DB

A static web-based audio player for Rhythm&Strings draft recordings. Features a custom glassmorphism UI, audio visualizations, and simple track management.

## Setup

Since this is a static plain HTML/CSS/JS project, you can simply open `index.html` in your browser or run a simple local server:

```bash
python -m http.server 8000
```

And access `http://localhost:8000` in your browser.

## Deployment

This site is configured to be deployed on Vercel. Basic authentication is enforced via Vercel Edge Middleware.

### Environment Variables

When deploying to Vercel, make sure to configure the following environment variable in your project settings:
- `PASSWORD`: The password required to access the site. (The default username is `user`).
