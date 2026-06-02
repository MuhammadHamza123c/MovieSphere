FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 7860

ENV TMDB_API_KEY=4861f7d1c63c8f09d3fc10c2c17bd675

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
