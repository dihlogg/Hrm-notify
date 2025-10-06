import { Model, FilterQuery } from 'mongoose';

interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sort?: Record<string, 1 | -1>; // sort -1 for desc, 1 for asc
}

export async function paginationMongo<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: PaginationOptions = {},
) {
  const page = Number(options.page) || 1;
  const pageSize = Number(options.pageSize) || 10;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model
      .find(filter)
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    currentPage: page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
