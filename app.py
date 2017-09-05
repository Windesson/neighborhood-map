from flask import Flask,render_template
import os
app = Flask(__name__)

@app.route('/')
def main():
    return render_template('index.html')
	
if __name__ == '__main__':
    app.secret_key = 'super_secret_key'
    app.debug = True
    #app.run(host='0.0.0.0', port=8000)
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port = port)