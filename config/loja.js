/* =====================================================================
   CONFIGURAÇÃO DA LOJA — Rei Lanches
   Gerado pelo gerador de cardápios em 24/10/2026, 21:46:34.
   Para mudar algo, edite a loja no gerador e exporte de novo.
   ===================================================================== */
window.LOJA = {
  "id": "rei-lanches",
  "loja": {
    "nome": "Rei Lanches",
    "logo": "assets/logo.webp",
    "whatsapp": "5544998305387",
    "instagram": "",
    "fechadoManual": false,
    "horarios": {
      "seg": "",
      "ter": "18:00-23:00",
      "qua": "18:00-23:00",
      "qui": "18:00-23:00",
      "sex": "18:00-23:59",
      "sab": "18:00-23:59",
      "dom": "18:00-23:00"
    },
    "endereco": " Av. Ivaí São Manoel do Paraná, Paraná",
    "entrega": true,
    "retirada": true,
    "taxaEntrega": 5,
    "pedidoMinimo": 0,
    "tempoEntrega": "40–60 min",
    "tempoRetirada": "20–30 min",
    "pagamentos": [
      "Pix",
      "Dinheiro",
      "Cartão de crédito",
      "Cartão de débito"
    ]
  },
  "visual": {
    "corPrincipal": "#E9B226",
    "corSecundaria": "#ff7e38",
    "corEscura": "#111111",
    "layout": "lista",
    "mostrarBanner": true
  },
  "categorias": [
    {
      "id": "lanches",
      "nome": "Lanches",
      "icone": "",
      "oculta": false
    },
    {
      "id": "bebidas",
      "nome": "Bebidas",
      "icone": "",
      "oculta": false
    },
    {
      "id": "categoria",
      "nome": "Hamburgues",
      "icone": "",
      "oculta": false
    },
    {
      "id": "categoria-2",
      "nome": "Sorvetes",
      "icone": "",
      "oculta": false
    }
  ],
  "grupos": [
    {
      "id": "adicionais",
      "nome": "Adicionais",
      "tipo": "multipla",
      "obrigatorio": false,
      "min": 0,
      "max": 0,
      "opcoes": [
        {
          "nome": "Bacon",
          "preco": 4
        },
        {
          "nome": "Cheddar extra",
          "preco": 3
        }
      ]
    }
  ],
  "produtos": [
    {
      "id": "rei-classico",
      "tipo": "produto",
      "nome": "Rei Clássico",
      "categoria": "categoria",
      "preco": 20,
      "descricao": "Hambúrguer bovino grelhado, queijo cheddar derretido, alface fresquinha, tomate em rodelas, cebola roxa, picles e maionese cremosa, servidos em pão macio com gergelim",
      "fotos": [
        "assets/img/rei-classico.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": false,
      "remover": [],
      "grupos": [],
      "tamanhos": [],
      "adicionais": []
    },
    {
      "id": "rei-bacon",
      "tipo": "produto",
      "nome": "Rei Bacon",
      "categoria": "categoria",
      "preco": 18,
      "descricao": "Hambúrguer bovino suculento, cheddar derretido, generosas fatias de bacon crocante, alface, tomate, cebola roxa e molho especial da casa, no pão brioche levemente tostado.",
      "fotos": [
        "assets/img/rei-bacon.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": true,
      "remover": [],
      "grupos": [
        "adicionais"
      ],
      "tamanhos": [],
      "adicionais": []
    },
    {
      "id": "rei-duplo",
      "tipo": "produto",
      "nome": "Rei Duplo",
      "categoria": "categoria",
      "preco": 22,
      "descricao": "Dois hambúrgueres bovinos grelhados, duas camadas de cheddar cremoso, alface, tomate, cebola roxa, picles e molho especial, no pão com gergelim.",
      "fotos": [
        "assets/img/rei-duplo.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": false,
      "remover": [],
      "grupos": [],
      "tamanhos": [],
      "adicionais": []
    },
    {
      "id": "rei-chicken-crispy",
      "tipo": "produto",
      "nome": "Rei Chicken Crispy",
      "categoria": "categoria",
      "preco": 25,
      "descricao": "Filé de frango empanado e crocante, queijo cheddar derretido, alface, tomate e maionese temperada com ervas, servidos no pão macio com gergelim.",
      "fotos": [
        "assets/img/rei-chicken-crispy.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": false,
      "remover": [],
      "grupos": [],
      "tamanhos": [],
      "adicionais": []
    },
    {
      "id": "refrigerante-de-cola-gelado",
      "tipo": "produto",
      "nome": "Refrigerante de Cola Gelado",
      "categoria": "bebidas",
      "preco": 5,
      "descricao": "Refrigerante sabor cola, servido bem gelado, com cubos de gelo. Refrescante e perfeito para acompanhar seu lanche favorito.",
      "fotos": [
        "assets/img/refrigerante-de-cola-gelado.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": false,
      "remover": [],
      "grupos": [],
      "tamanhos": [],
      "adicionais": []
    },
    {
      "id": "refrigerante-de-laranja-gelado",
      "tipo": "produto",
      "nome": "Refrigerante de Laranja Gelado",
      "categoria": "bebidas",
      "preco": 5,
      "descricao": "Refrigerante sabor laranja, com gás, servido com bastante gelo. Uma opção cítrica, doce e refrescante.",
      "fotos": [
        "assets/img/refrigerante-de-laranja-gelado.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": false,
      "remover": [],
      "grupos": [],
      "tamanhos": [],
      "adicionais": []
    },
    {
      "id": "milk-shake-real-de-chocolate-com-cookies",
      "tipo": "produto",
      "nome": "Milk-shake Real de Chocolate com Cookies",
      "categoria": "categoria-2",
      "preco": 15,
      "descricao": "Milk-shake cremoso de chocolate com pedaços de cookies, cobertura de chantilly, calda de chocolate e biscoito de chocolate crocante. Uma sobremesa irresistível para completar seu pedido.",
      "fotos": [
        "assets/img/milk-shake-real-de-chocolate-com-cookies.webp"
      ],
      "nota": 0,
      "destaque": false,
      "disponivel": true,
      "pontoCarne": false,
      "remover": [],
      "grupos": [],
      "tamanhos": [],
      "adicionais": []
    }
  ],
  "cupons": [],
  "seo": {
    "titulo": "",
    "descricao": "",
    "imagem": "assets/img/banner.webp",
    "favicon": "assets/favicon.png",
    "url": ""
  },
  "rastreamento": {
    "metaPixel": "",
    "googleAnalytics": ""
  },
  "banner": {
    "chamada": "",
    "titulo": "",
    "botao": "Pedir agora",
    "imagem": "assets/img/banner.webp",
    "produto": ""
  },
  "admin": {
    "pin": ""
  }
};
