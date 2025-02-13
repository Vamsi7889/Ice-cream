document.addEventListener('DOMContentLoaded', () => {
    const flavorsList = document.getElementById('flavors-list');
    const cartList = document.getElementById('cart-list');
    const addFlavorForm = document.getElementById('add-flavor-form');
    const searchInput = document.getElementById('search');
    const flavorsContainer = document.getElementById('flavors-container');
    const cartContainer = document.getElementById('cart-container');
    const cartTotal = document.getElementById('cart-total');

    let flavors = [];
    let cart = [];

    // Fetch flavors from the server
    async function fetchFlavors() {
        try {
            const response = await fetch('/flavors');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            flavors = await response.json();
            renderFlavors(flavors);
        } catch (error) {
            console.error("Error fetching flavors:", error);
            displayMessage(flavorsContainer, "Error loading flavors.");
        }
    }

    // Render flavors list
    function renderFlavors(flavorsToRender) {
        flavorsList.innerHTML = '';
        if (flavorsToRender.length === 0) {
            flavorsList.innerHTML = "<li>No flavors found.</li>";
            return;
        }

        flavorsToRender.forEach(flavor => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${flavor.name}</span> <button class="add-to-cart" data-id="${flavor.id}">Add to Cart</button>`;
            flavorsList.appendChild(li);
        });
    }


    // Filter flavors
    function filterFlavors() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredFlavors = flavors.filter(flavor =>
            flavor.name.toLowerCase().includes(searchTerm)
        );
        renderFlavors(filteredFlavors);
    }

    // Add flavor to cart
    async function addToCart(flavorId) {
        try {
            const response = await fetch('/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ flavorId })
            });

            if (!response.ok) {
                const errorData = await response.json(); 
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`); 
            }

            const data = await response.json();
            console.log("Flavor added to cart:", data);
            fetchCart(); // Refresh cart display
            displayMessage(cartContainer, "Added to cart!");

        } catch (error) {
            console.error("Error adding to cart:", error);
            displayMessage(cartContainer, error.message); 
        }
    }

    // Fetch cart items
    async function fetchCart() {
        try {
            const response = await fetch('/cart');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            cart = await response.json();
            renderCart();
        } catch (error) {
            console.error("Error fetching cart:", error);
             displayMessage(cartContainer, "Error loading cart.");
        }
    }

    // Render cart items
    function renderCart() {
        cartList.innerHTML = '';
        let totalItems = 0;
        cart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `${item.name} <button class="remove-from-cart" data-id="${item.id}">Remove</button>`;
            cartList.appendChild(li);
            totalItems++;
        });
        cartTotal.textContent = `Total Items: ${totalItems}`;

        if (cart.length === 0) {
            cartList.innerHTML = "<li>Your cart is empty.</li>";
        }
    }

    // Remove from cart
    async function removeFromCart(flavorId) {
        try {
            const response = await fetch(`/cart/${flavorId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchCart();
            displayMessage(cartContainer, "Removed from cart!");
        } catch (error) {
            console.error("Error removing from cart:", error);
            displayMessage(cartContainer, error.message);
        }
    }

    // Add new flavor
    addFlavorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('flavor-name').value;
        const ingredients = document.getElementById('flavor-ingredients').value;
        const allergens = document.getElementById('flavor-allergens').value;

        try {
            const response = await fetch('/flavors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, ingredients, allergens })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const newFlavor = await response.json();
            console.log("New flavor added:", newFlavor);
            addFlavorForm.reset(); 
            fetchFlavors(); 
            displayMessage(flavorsContainer, "Flavor added!");

        } catch (error) {
            console.error("Error adding flavor:", error);
            displayMessage(flavorsContainer, error.message);
        }
    });

    // Event listeners
    flavorsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart')) {
            const flavorId = event.target.dataset.id;
            addToCart(flavorId);
        }
    });

    cartList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-from-cart')) {
            const flavorId = event.target.dataset.id;
            removeFromCart(flavorId);
        }
    });

    function displayMessage(container, message) {
      const messageElement = document.createElement('p');
      messageElement.textContent = message;
      container.insertBefore(messageElement, container.firstChild); 
      setTimeout(() => {
        container.removeChild(messageElement); 
      }, 3000); 
    }


    fetchFlavors();
    fetchCart();
});
