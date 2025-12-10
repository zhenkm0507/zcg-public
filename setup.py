from setuptools import setup, find_packages

# 读取 requirements.txt
with open('requirements.txt') as f:
    requirements = f.read().splitlines()

setup(
    name="zcg",
    version="0.1",
    package_dir={"": "backend"},  # 指定包的根目录
    packages=find_packages(where="backend"),  # 在 backend 目录下查找包
    install_requires=requirements,
) 