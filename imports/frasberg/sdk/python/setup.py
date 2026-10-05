from setuptools import setup, find_packages

with open('README.md', 'r') as f:
    long_description = f.read()

setup(
    name='frasberg-sdk',
    version='6.0.0',
    packages=find_packages(),
    install_requires=[
        'requests>=2.28.0',
    ],
    author='Frasberg AI Team',
    description='Python SDK for Frasberg AI',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/FrasbergAI/frasberg',
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3.11',
    ],
)
