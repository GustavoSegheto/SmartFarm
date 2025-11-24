// Interatividade básica
    document.addEventListener('DOMContentLoaded', function() {
      // Alternar favorito
      const favoriteBtn = document.querySelector('.favorite-btn');
      favoriteBtn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('far')) {
          icon.classList.remove('far');
          icon.classList.add('fas');
          this.classList.add('active');
        } else {
          icon.classList.remove('fas');
          icon.classList.add('far');
          this.classList.remove('active');
        }
      });

      // Adicionar ao carrinho
      const addToCartBtn = document.querySelector('.add-to-cart');
      addToCartBtn.addEventListener('click', function() {
        // Efeito visual
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
        this.style.background = '#2e7d32';
        
        setTimeout(() => {
          this.innerHTML = originalText;
          this.style.background = '#4CAF50';
        }, 1500);
      });
    });
  