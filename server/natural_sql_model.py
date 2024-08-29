from flask import Flask, request, jsonify
import ast
from gradio_client import Client
import os

app = Flask(__name__)

# Define host URL
HOST_URL = "http://192.168.100.246:5006"
client = Client(HOST_URL)

# Service POST

# 
@app.route('/query-bagas', methods=['POST'])
def query():
    data = request.json
    question = data['question']

    # Read DDL file
    ddl_file_path = "ddl.sql"
    if os.path.exists(ddl_file_path):
        with open(ddl_file_path, "r") as file:
            ddl_content = file.read()
    else:
        raise FileNotFoundError(f"DDL file '{ddl_file_path}' not found.")
        
   prompt = """### Instructions:
    Your task is convert a question into a SQL query, given a Clickhouse database schema.
    Adhere to these rules:
    - **Deliberately go through the question and database schema word by word** to appropriately answer the question
    - **Use Table Aliases** to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`.

    ### Input:
    Generate a SQL query that answers the question `{question}`.
    This query will run on a database whose schema is represented in this string:

    `{ddl_content}`

    ### Response:
    Based on your instructions, here is the SQL query I have generated to answer the question `{question}`:
    ```sql
    """.format(question=question, ddl_content=ddl_content)

    # Define kwargs for model prediction
    # kwargs = dict(
    #     instruction=prompt,
    #     num_return_sequences = 1,
    #     eos_token_id = 100001,
    #     pad_token_id = 100001,
    #     max_new_tokens = 500, 
    #     do_sample = False,
    #     num_beams = 1
    # )

    # # Get result from the external service
    # res = client.predict(str(dict(kwargs)), api_name='/submit_nochat_api')
    # sql_query = ast.literal_eval(res)['response']
    sql_query = client.predict(prompt)
    return jsonify({'query': sql_query})

if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0", port=8065)