from app import create_app

# EB looks for 'application' by default, Railway looks for 'app'
application = create_app()
app = application  # Railway compatibility

if __name__ == "__main__":
    application.run(debug=False)