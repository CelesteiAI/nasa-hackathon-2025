from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def hello_world():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>NASA Hackathon 2025</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .container {
                text-align: center;
                padding: 40px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            h1 {
                font-size: 3em;
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            p {
                font-size: 1.5em;
                margin-top: 20px;
            }
            .emoji {
                font-size: 4em;
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                margin-top: 30px;
                padding: 15px 30px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                border-radius: 10px;
                font-size: 1.2em;
                transition: all 0.3s;
                border: 2px solid white;
            }
            .button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="emoji">🚀🌌</div>
            <h1>Hello World!!!</h1>
            <p>NASA Hackathon 2025</p>
            <p style="font-size: 1em; opacity: 0.8;">Docker is running successfully! 🐳</p>
            <a href="/solar-system" class="button">🪐 View Solar System 3D</a>
        </div>
    </body>
    </html>
    '''

@app.route('/solar-system')
def solar_system():
    return render_template('solar-system.html')

@app.route('/health')
def health():
    return {'status': 'healthy', 'message': 'NASA Hackathon 2025 is running!'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

