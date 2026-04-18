import '@angular/compiler';
import { of, throwError } from 'rxjs';
import { ServicoService, Servico } from './servico.service';

// Mock do Jasmine para compatibilidade
declare const jasmine: any;
declare const spyOn: any;
declare const fail: any;

describe('ServicoService', () => {
  let service: ServicoService;
  let mockHttpClient: any;

  const mockServico: Servico = {
    id: 1,
    nome: 'Lavação Simples',
    preco: 29.90,
    duracao_estimada_minutos: 30,
    is_active: true
  };

  beforeEach(() => {
    // Mock do HttpClient completo
    mockHttpClient = {
      get: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue(of([]))
      }),
      post: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue(of({}))
      }),
      put: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue(of({}))
      }),
      patch: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue(of({}))
      }),
      delete: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue(of({}))
      })
    };

    // Criar service manualmente com mock
    service = new ServicoService(mockHttpClient);

    // Mock do localStorage
    localStorage.setItem('access_token', 'mock_token_123');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listarServicos', () => {
    it('should return list of services', () => {
      const mockServicos: Servico[] = [mockServico];
      
      // Mock do HttpClient.get para retornar os serviços
      mockHttpClient.get.mockReturnValue({
        pipe: vi.fn().mockReturnValue(of(mockServicos))
      });

      service.listarServicos().subscribe(servicos => {
        expect(servicos).toEqual(mockServicos);
      });

      expect(mockHttpClient.get).toHaveBeenCalled();
    });

    it('should handle error when listing services', () => {
      // Mock do HttpClient.get para retornar erro
      mockHttpClient.get.mockReturnValue({
        pipe: vi.fn().mockReturnValue(throwError(() => new Error('Server Error')))
      });

      service.listarServicos().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      expect(mockHttpClient.get).toHaveBeenCalled();
    });
  });
});
