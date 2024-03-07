if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}
import { db } from '../models';
import { cleanDb } from '../helpers/testHelpers';
import fetch from 'node-fetch';

const populate = async () => {
  await cleanDb();
  console.log('Populating database...');

  const ships = await fetch('https://spacex-production.up.railway.app/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ ships { id name image class active missions {flight name} } }' }),
  })
    .then(res => res.json())
    .then(data => data.data.ships);

  for (const ship of ships) {
    const newShip = await db.Ship.create({
      active: ship.active,
      name: ship.name,
      class: ship.class,
      image: ship.image,
    });

    if (ship.missions && ship.missions.length > 0) {
      await Promise.all(
        ship.missions.map(mission =>
          db.Mission.create({
            name: mission.name,
            destination: mission.destination,
            cargo: mission.cargo,
            active: true,
            shipId: newShip.id,
          }),
        ),
      );
    } else {
      //populating some dummy data
      await db.Mission.create({
        name: 'mission.name',
        destination: 'mission.flight',
        cargo: 'cargo',
        active: true,
        shipId: newShip.id,
      });
    }
  }

  await db.sequelize.close();
};

if (require.main === module) {
  populate();
}

export { populate };
