import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController{
    async index (request: Request, response: Response){
        const {uf, city, items} = request.query;

        const parsedItem = String(items)
                .split(',')
                .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'point_items.point_id', '=', 'points.id')
            .whereIn('point_items.item_id', parsedItem)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct();
            // .select('point.*');
        
        response.json(points);
    }

    async show (request: Request, response: Response){
        const {id} = request.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return response.status(400).json({message: 'Point not found!'});
        }

        const items = await knex('items')
                    .join('point_items', 'items.id', '=', 'point_items.item_id')
                    .where('point_items.point_id', id);

        return response.json({point, items});
    }

    async create (request: Request, response: Response){
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
        
        const point = {
            image: 'https://images.unsplash.com/photo-1556767576-5ec41e3239ea?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=80',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        const trx = await knex.transaction();

        const insertedId = await trx('points').insert(point);
        const point_id = insertedId[0];

        const pointsItems = items.map((item_id: number) => {
            return {
                point_id: point_id,
                item_id: item_id
            }
        });

        const insertedItems = await trx('point_items').insert(pointsItems);
    
        await trx.commit();

        return response.json({
            id: point_id
            // ...point
        });
    }
}

export default PointsController;