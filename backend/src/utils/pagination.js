const getPaginationMetadata = async (model, page, limit, filter = {}) => {
    const totalItems = await model.count(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
};

module.exports = { getPaginationMetadata }; 