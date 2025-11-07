/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    return Number(sale_price) * Number(quantity) * (1 - Number(discount) / 100);
}


function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // Проверка опций
    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Не переданы необходимые функции расчёта');
    }

    // Подготовка статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Индексы
    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    // Обработка чеков
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenue = calculateRevenue(item, product);
            const cost = Number(product.purchase_price) * Number(item.quantity);
            const itemProfit = revenue - cost;

            seller.revenue += +( (seller.revenue + revenue).toFixed(2) );
            seller.profit += +( (seller.profit + itemProfit).toFixed(2) );
            seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + Number(item.quantity);
        });
    });

    // Сортировка по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Назначение бонусов и топ-10
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    // Формирование результата
    return sellerStats.map(seller => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +(seller.revenue.toFixed(2)),
    profit: +(seller.profit.toFixed(2)),     
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +(seller.bonus.toFixed(2))        
}));
}