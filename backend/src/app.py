from flask import Flask, jsonify
from flask_cors import CORS
from route.userAuth import user_bp
from route.documents import documents_bp
from route.chat import chat_bp
from route.admin import admin_bp
from route.swagger_docs import documents_ns
from config import FRONTEND_URL
from flask_restx import Api

api = Api(
    title="My Flask API",
    version="1.0",
    description="API documentation",
    doc="/docs",
)

def create_app() -> Flask:
    app = Flask(__name__)
    
    CORS(
        app,
        supports_credentials=False,
        origins=[FRONTEND_URL],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )
    api.init_app(app)
    api.add_namespace(documents_ns, path="/documents")
    
    app.register_blueprint(user_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(admin_bp)

    @app.get("/health")
    def health():
        return jsonify({"success": True}), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)