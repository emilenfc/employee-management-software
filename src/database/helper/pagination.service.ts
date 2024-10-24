import { Injectable } from '@nestjs/common';

@Injectable()
export class PaginationHelper {
  async paginate(
    entity,
    pageSize?: number,
    pageNumber?: number,
    filter = {},
  ): Promise<any> {
    const filteringObject = {};
    for (const key in filter) {
      if (filter[key] != null) filteringObject[key] = filter[key];
    }
    pageSize = pageSize || 10;
    pageNumber = pageNumber || 1;
    if (pageSize && pageNumber) {
      const take = pageSize || 10;
      const page = Number(pageNumber) || 1;
      const skip = (page - 1) * take;
      const [list, total] = await entity.findAndCount({
        ...filteringObject,
        take,
        skip,
      });
      const lastPage = Math.ceil(total / take);
      const nextPage = page + 1 > lastPage ? null : page + 1;
      const prevPage = page - 1 < 1 ? null : page - 1;
      return {
        status: 'success',
        list,
        total,
        previousPage: prevPage,
        nextPage,
        lastPage,
        currentPage: page,
      };
    } else {
      return await entity.find({
        ...filteringObject,
      });
    }
  }
}
