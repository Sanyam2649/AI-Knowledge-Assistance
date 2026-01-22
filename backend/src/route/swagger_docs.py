from flask_restx import Namespace, Resource

documents_ns = Namespace("documents", description="Document APIs")

@documents_ns.route("/")
class Documents(Resource):
    def get(self):
        """Get all documents"""
        return {"documents": []}, 200
