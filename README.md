🕵️‍♂️ Real or Render – Deepfake Detection System
📖 Overview

Real or Render is a deepfake detection project designed to identify whether an image or video is real or AI-generated.
The project combines a modern Next.js frontend with a Python-based deepfake detection backend, focusing on image and video verification.

This project is built to address the growing challenge of media authenticity and misinformation caused by deepfake technology.

🚀 Features

Upload and verify images for deepfake detection

Upload and verify videos for deepfake detection

Clean and responsive UI built with Next.js & Tailwind CSS

CNN-based deepfake classification (backend)

Verification result display

Modular and scalable project structure

🧠 Tech Stack
Frontend

Next.js (App Router)

TypeScript

Tailwind CSS

Backend / ML

Python

TensorFlow / Keras

OpenCV

CNN (Convolutional Neural Network)

📂 Project Structure
real-or-render/
│
├── app/
│   ├── verify-image/
│   ├── verify-video/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── file-uploader.tsx
│   ├── verification-result.tsx
│   └── site-header.tsx
│
├── lib/
│   └── utils.ts
│
├── api_for_mini_project.py
├── face_detection_yunet_2023mar.onnx
├── package.json
├── next.config.ts
└── README.md

⚙️ How It Works

User uploads an image or video via the frontend.

The file is sent to the backend API.

A CNN model processes the input and extracts facial features.

The model predicts whether the media is Real or AI-Generated.

The result is displayed on the UI.

📊 Model Evaluation

The deepfake classification model is evaluated using:

Accuracy

Precision

Recall

F1-Score

These metrics help ensure reliable and balanced performance.

🎯 Learning Outcomes

Practical experience with CNNs for computer vision

Understanding deepfake detection techniques

Full-stack integration (Frontend + ML backend)

Clean project structuring for real-world applications

📌 Use Case

Academic and research purposes

Learning project for deepfake detection

Demonstration of AI + Full-Stack integration

⚠️ Disclaimer

This project is developed for educational and research purposes only.
It is not intended for production or legal decision-making.

👨‍💻 Author

Rohit Ghanvat
B.E. Artificial Intelligence & Data Science

⭐ Future Improvements

Improve model accuracy with larger datasets

Add real-time video analysis

Deploy backend using FastAPI

Cloud deployment (AWS / GCP)

✅ This README is:

✔ Resume-aligned
✔ Interview-ready
✔ Recruiter-friendly
