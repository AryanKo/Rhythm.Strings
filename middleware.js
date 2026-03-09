export const config = {
    matcher: '/',
}

export default function middleware(request) {
    const authorizationHeader = request.headers.get('authorization')

    if (authorizationHeader) {
        const basicAuth = authorizationHeader.split(' ')[1]
        try {
            const [user, password] = atob(basicAuth).split(':')

            if (user === 'user' && password === process.env.PASSWORD) {
                // Return nothing to let Vercel continue serving the static files
                return
            }
        } catch (e) {
            // Ignore malformed headers, it will fall through to the 401 response
        }
    }

    return new Response('Auth required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    })
}
