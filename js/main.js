
const PRODUCT_URL = './data/product.json';

const elements = {
    product: document.querySelector('#product'),
    error: document.querySelector('#product-error'),

    breadcrumbCategory: document.querySelector('#breadcrumb-category'),
    breadcrumbTitle: document.querySelector('#breadcrumb-title'),

    image: document.querySelector('#product-image'),
    category: document.querySelector('#product-category'),
    title: document.querySelector('#product-title'),
    description: document.querySelector('#product-description'),
    details: document.querySelector('#product-details'),
    benefits: document.querySelector('#benefits'),
    properties: document.querySelector('#properties'),

    variants: document.querySelector('#variant-list'),

    purchasePrice: document.querySelector('#purchase-price'),
    purchaseOldPrice: document.querySelector('#purchase-old-price'),
    sku: document.querySelector('#product-sku'),
    total: document.querySelector('#purchase-total'),

    quantity: document.querySelector('#quantity'),
    decrease: document.querySelector('#quantity-decrease'),
    increase: document.querySelector('#quantity-increase'),

    addToCart: document.querySelector('#add-to-cart'),
    cartFeedback: document.querySelector('#cart-feedback')
};

const state = {
    product: null,
    selectedVariant: null,
    quantity: 1
};

const formatPrice = (price) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 2
    }).format(price);

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}


function renderProduct(product) {
    state.product = product;

    document.title = `${product.title} — TeaBoom`;

    elements.breadcrumbCategory.textContent = product.category;
    elements.breadcrumbTitle.textContent = product.title;

    elements.image.src = product.image;
    elements.image.alt = product.title;

    elements.category.textContent = product.category;
    elements.title.textContent = product.title;
    elements.description.textContent = product.description;

    const details = [
        ['Состав', product.compound],
        ['Вкус', product.taste]
    ];

    elements.details.replaceChildren();

    details.forEach(([label, value]) => {
        if (!value) return;

        const item = createElement('p', 'product-description__item');
        const title = createElement('strong', '', `${label}: `);
        const text = document.createTextNode(value);

        item.append(title, text);
        elements.details.append(item);
    });

    elements.benefits.replaceChildren();

    product.benefits.forEach((benefit) => {
        const item = createElement('li', 'product-benefits__item');
        item.textContent = benefit;
        elements.benefits.append(item);
    });

    elements.properties.replaceChildren();

    product.properties.forEach(({ label, value }) => {
        const item = createElement('div', 'product-property');
        const propertyLabel = createElement(
            'span',
            'product-property__label',
            label
        );
        const propertyValue = createElement(
            'span',
            'product-property__value',
            value
        );

        item.append(propertyLabel, propertyValue);
        elements.properties.append(item);
    });

    renderVariants(product.variants);
    selectVariant(product.variants[0]);

    elements.addToCart.disabled = false;
    elements.product.setAttribute('aria-busy', 'false');
}


function renderVariants(variants) {
    elements.variants.replaceChildren();

    variants.forEach((variant) => {
        const button = createElement(
            'button',
            'variant-button',
            `${formatWeight(variant.weight)} г`
        );

        button.type = 'button';
        button.dataset.sku = variant.sku;
        button.setAttribute(
            'aria-pressed',
            String(variant === state.selectedVariant)
        );

        button.addEventListener('click', () => {
            selectVariant(variant);
        });

        elements.variants.append(button);
    });
}

function formatWeight(weight) {
    return new Intl.NumberFormat('ru-RU').format(weight);
}

function selectVariant(variant) {
    if (!variant) return;

    state.selectedVariant = variant;

    elements.variants.querySelectorAll('.variant-button')
        .forEach((button) => {
            const isSelected = button.dataset.sku === variant.sku;

            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });

    updatePurchaseInfo();
}

function updatePurchaseInfo() {
    const { selectedVariant, quantity } = state;

    if (!selectedVariant) return;

    elements.purchasePrice.textContent =
        formatPrice(selectedVariant.price);

    elements.purchaseOldPrice.textContent =
        selectedVariant.oldPrice > selectedVariant.price
            ? formatPrice(selectedVariant.oldPrice)
            : '';

    elements.sku.textContent = selectedVariant.sku;

    elements.total.textContent =
        formatPrice(selectedVariant.price * quantity);
}

function normalizeQuantity(value) {
    const quantity = Number.parseInt(value, 10);

    if (!Number.isFinite(quantity)) return 1;

    return Math.min(99, Math.max(1, quantity));
}

function setQuantity(value) {
    state.quantity = normalizeQuantity(value);
    elements.quantity.value = state.quantity;

    updatePurchaseInfo();
}

elements.decrease.addEventListener('click', () => {
    setQuantity(state.quantity - 1);
});

elements.increase.addEventListener('click', () => {
    setQuantity(state.quantity + 1);
});

elements.quantity.addEventListener('change', () => {
    setQuantity(elements.quantity.value);
});

elements.quantity.addEventListener('input', () => {
    elements.cartFeedback.textContent = '';
});

elements.addToCart.addEventListener('click', () => {
    const { product, selectedVariant, quantity } = state;

    if (!product || !selectedVariant) return;

    elements.cartFeedback.textContent =
        `Добавлено: ${product.title}, ${formatWeight(selectedVariant.weight)} г × ${quantity}.`;

    elements.addToCart.textContent = 'Добавлено ✓';
});

async function init() {
    try {
        const response = await fetch(PRODUCT_URL);

        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        const product = await response.json();

        renderProduct(product);
    } catch (error) {
        console.error('Не удалось загрузить товар:', error);

        elements.product.hidden = true;
        elements.error.hidden = false;
        elements.error.textContent =
            'Не удалось загрузить товар';
    }
}

init();
