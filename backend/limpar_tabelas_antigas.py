#!/usr/bin/env python
import os
import django
import sqlite3

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lava_me.settings')
django.setup()

from django.db import connection

def limpar_tabelas_antigas():
    """Remove tabelas do antigo app atendimentos e limpa migrações"""
    
    # Conexão direta ao SQLite
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # Listar todas as tabelas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = [row[0] for row in cursor.fetchall()]
    
    print("=== TODAS AS TABELAS ===")
    for table in all_tables:
        print(table)
    
    # Identificar tabelas de atendimentos
    atendimento_tables = [t for t in all_tables if 'atendimento' in t]
    print("\n=== TABELAS DE ATENDIMENTOS ===")
    for table in atendimento_tables:
        print(table)
    
    # Remover tabelas de atendimentos
    for table in atendimento_tables:
        try:
            cursor.execute(f'DROP TABLE IF EXISTS {table}')
            print(f'Tabela {table} removida com sucesso')
        except Exception as e:
            print(f'Erro ao remover tabela {table}: {e}')
    
    # Limpar histórico de migrações usando Django connection
    django_cursor = connection.cursor()
    try:
        django_cursor.execute("DELETE FROM django_migrations WHERE app='atendimentos'")
        print('Histórico de migrações do app atendimentos limpo')
    except Exception as e:
        print(f'Erro ao limpar migrações: {e}')
    
    # Commit das mudanças
    conn.commit()
    conn.close()
    
    print("\n=== LIMPEZA CONCLUÍDA ===")

if __name__ == '__main__':
    limpar_tabelas_antigas()
