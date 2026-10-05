from setuptools import setup, find_packages
import os

# Read README if it exists
readme_path = os.path.join(os.path.dirname(__file__), 'README.md')
long_description = ''
if os.path.exists(readme_path):
    with open(readme_path, 'r') as f:
        long_description = f.read()

setup(
    name='frasberg-cli',
    version='6.0.0',
    packages=find_packages(),
    install_requires=[
        'click>=8.0.0',
        'requests>=2.28.0',
        'rich>=13.0.0',
    ],
    entry_points={
        'console_scripts': [
            'frasberg=frasberg.main:cli',
        ],
    },
    author='Frasberg Team',
    description='Command-line interface for Frasberg',
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
