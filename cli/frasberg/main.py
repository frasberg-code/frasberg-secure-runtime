#!/usr/bin/env python3
"""Frasberg AI CLI - Command-line interface for Frasberg AI"""

import click
import requests
import json
from rich.console import Console
from rich.table import Table
from rich import print as rprint

console = Console()

BASE_URL = "http://localhost:8000"

@click.group()
@click.version_option(version='5.0.0')
def cli():
    """Frasberg AI CLI - Manage your Frasberg AI instance"""
    pass

@cli.command()
def health():
    """Check system health"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        data = response.json()
        
        if response.status_code == 200:
            rprint(f"[green]✓[/green] Frasberg AI is healthy")
            rprint(f"Version: {data.get('version')}")
            rprint(f"Status: {data.get('status')}")
        else:
            rprint(f"[red]✗[/red] Health check failed")
    except Exception as e:
        rprint(f"[red]✗[/red] Cannot connect to Frasberg AI: {e}")

@cli.command()
def status():
    """Get detailed system status"""
    try:
        response = requests.get(f"{BASE_URL}/health/detailed")
        data = response.json()
        
        table = Table(title="Frasberg AI System Status")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Overall Status", data.get('overall_status', 'unknown'))
        table.add_row("Version", data.get('version', 'unknown'))
        
        resources = data.get('system_resources', {})
        table.add_row("CPU Usage", f"{resources.get('cpu_percent', 0)}%")
        table.add_row("Memory Usage", f"{resources.get('memory_percent', 0)}%")
        table.add_row("Disk Usage", f"{resources.get('disk_percent', 0)}%")
        
        console.print(table)
    except Exception as e:
        rprint(f"[red]✗[/red] Error getting status: {e}")

@cli.command()
@click.argument('text')
@click.option('--language', default='en', help='Language code (en, es, fr, etc.)')
@click.option('--emotion', default='neutral', help='Emotion tone')
def speak(text, language, emotion):
    """Generate speech from text"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/v2/voice/tts/synthesize",
            json={
                "text": text,
                "language": language,
                "emotion": emotion
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            rprint(f"[green]✓[/green] Speech synthesized")
            rprint(f"Audio URL: {data.get('audio_url')}")
            rprint(f"Duration: {data.get('duration_seconds')}s")
        else:
            rprint(f"[red]✗[/red] Failed to synthesize speech")
    except Exception as e:
        rprint(f"[red]✗[/red] Error: {e}")

@cli.command()
@click.argument('prompt')
@click.option('--model', default='frasberg-ai', help='Model name (frasberg-ai uses server defaults)')
def generate(prompt, model):
    """Generate AI response via canonical endpoint"""
    try:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
        }

        response = requests.post(
            f"{BASE_URL}/api/llm/generate",
            json=payload
        )

        if response.status_code == 200:
            data = response.json()
            rprint(f"\n[cyan]Response:[/cyan]")
            rprint(data.get('output'))
            usage = data.get('usage', {})
            rprint(f"\n[dim]Input tokens: {usage.get('input_tokens')} | Output tokens: {usage.get('output_tokens')}[/dim]")
        else:
            rprint(f"[red]✗[/red] Generation failed: {response.text}")
    except Exception as e:
        rprint(f"[red]✗[/red] Error: {e}")

@cli.command()
def services():
    """List all available services"""
    services_list = [
        ("Canonical Core", "8000", "All core features"),
        ("Education Fork", "8001", "Training simulations"),
        ("Healthcare Fork", "8002", "Non-clinical care"),
        ("Legal Fork", "8003", "Litigation support"),
        ("Research Fork", "8004", "Academic analysis"),
        ("Finance Fork", "8005", "Compliance & risk"),
        ("Government Fork", "8006", "Public service"),
        ("Med Research Fork", "8007", "Non-clinical research"),
        ("Analytics", "5000", "System metrics"),
        ("Admin UI", "3000", "Web dashboard")
    ]
    
    table = Table(title="Frasberg AI Services")
    table.add_column("Service", style="cyan")
    table.add_column("Port", style="yellow")
    table.add_column("Description", style="green")
    
    for service, port, desc in services_list:
        table.add_row(service, port, desc)
    
    console.print(table)

@cli.command()
def mesh():
    """Get mesh network topology"""
    try:
        response = requests.get(f"{BASE_URL}/api/v4/mesh/topology")
        if response.status_code == 200:
            data = response.json()
            
            table = Table(title="Mesh Network Topology")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")
            
            table.add_row("Total Nodes", str(data.get('total_nodes', 0)))
            table.add_row("Active Nodes", str(data.get('active_nodes', 0)))
            table.add_row("Regions", ", ".join(data.get('regions', [])))
            table.add_row("Mesh Health", f"{data.get('mesh_health', 0):.2%}")
            
            console.print(table)
        else:
            rprint(f"[red]✗[/red] Failed to get topology")
    except Exception as e:
        rprint(f"[red]✗[/red] Error: {e}")

@cli.command()
@click.option('--format', type=click.Choice(['table', 'json']), default='table')
def metrics(format):
    """Get system metrics"""
    try:
        response = requests.get(f"{BASE_URL}/metrics")
        if response.status_code == 200:
            data = response.json()
            
            if format == 'json':
                rprint(json.dumps(data, indent=2))
            else:
                table = Table(title="System Metrics")
                table.add_column("Metric", style="cyan")
                table.add_column("Value", style="green")
                
                table.add_row("Total Requests", str(data.get('requests_total', 0)))
                table.add_row("Total Errors", str(data.get('errors_total', 0)))
                table.add_row("Error Rate", f"{data.get('error_rate', 0):.2%}")
                table.add_row("Avg Response Time", f"{data.get('avg_response_time_ms', 0):.2f}ms")
                
                console.print(table)
        else:
            rprint(f"[red]✗[/red] Failed to get metrics")
    except Exception as e:
        rprint(f"[red]✗[/red] Error: {e}")

if __name__ == '__main__':
    cli()
