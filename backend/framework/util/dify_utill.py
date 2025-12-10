from urllib.parse import quote
from pathlib import Path
import requests
from framework.config.config import settings
from framework.util.logger import setup_logger

logger = setup_logger(__name__)

def upload_file(api_key:str,file_path):
    """
    上传文件到dify
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
    }
    
    try:
        logger.info("上传文件中...")
        with open(file_path, 'rb') as file:
            files = {
                'file': (quote(Path(file_path).name), file, 'image/jpg')  # 确保文件以适当的MIME类型上传
            }
            data = {
                "user": settings,
                "type": "JPG"  # 设置文件类型
            }
            
            response = requests.post(settings.DIFY_API_URL+"/files/upload", headers=headers, files=files, data=data)
            if response.status_code == 201:  # 201 表示创建成功
                logger.info("文件上传成功")
                return response.json().get("id")  # 获取上传的文件 ID
            else:
                logger.error(f"文件上传失败，状态码: {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"发生错误: {str(e)}")
        return None

def run_workflow(api_key:str,inputs, output_val, response_mode="blocking") -> str:
    """
    运行工作流
    
    Args:
        inputs (dict): 工作流的输入参数
        output_val (str): 需要获取的输出字段名
        response_mode (str, optional): 响应模式，默认为"blocking"
    
    Returns:
        str: 工作流执行结果
    """
    workflow_url = settings.DIFY_API_URL+"/workflows/run"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "inputs": inputs,
        "response_mode": response_mode,
        "user": settings.DIFY_USER
    }

    try:
        logger.info("运行工作流...")
        response = requests.post(workflow_url, headers=headers, json=data)
        if response.status_code == 200:
            logger.info("工作流执行成功")
            result = response.json().get("data").get("outputs").get(output_val)
            logger.info(f"工作流执行成功，结果: {result}")
            return result
        else:
            logger.error(f"工作流执行失败，状态码: {response.status_code}")
            return {"status": "error", "message": f"Failed to execute workflow, status code: {response.status_code}"}
    except Exception as e:
        logger.error(f"发生错误: {str(e)}")
        return {"status": "error", "message": str(e)}    
