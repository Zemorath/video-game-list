# Ultra minimal WSGI app to test basic deployment
def application(environ, start_response):
    """Raw WSGI application - no Flask dependencies"""
    path = environ.get('PATH_INFO', '/')
    
    if path in ['/', '/health']:
        status = '200 OK'
        response_body = b'OK - Raw WSGI working!'
    else:
        status = '404 Not Found'
        response_body = b'Not Found'
    
    headers = [
        ('Content-Type', 'text/plain'),
        ('Content-Length', str(len(response_body)))
    ]
    
    start_response(status, headers)
    return [response_body]

# For gunicorn compatibility
app = application
