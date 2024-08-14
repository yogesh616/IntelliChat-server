from flask import Flask, jsonify, request
import easyocr

app = Flask(__name__)

# Initialize EasyOCR reader outside the route function to load the model once
reader = easyocr.Reader(['ch_sim', 'en'])

@app.route('/ocr', methods=['POST'])
def get_image():
   
    file = 'OIP.jpg'
    
   
    # Perform OCR on the uploaded image
    result = reader.readtext(file)

    # Return JSON response
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
