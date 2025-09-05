import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createMenuItemInputSchema, 
  updateMenuItemInputSchema, 
  deleteMenuItemInputSchema 
} from './schema';

// Import handlers
import { createMenuItem } from './handlers/create_menu_item';
import { getMenuItems } from './handlers/get_menu_items';
import { getMenuItemById } from './handlers/get_menu_item_by_id';
import { updateMenuItem } from './handlers/update_menu_item';
import { deleteMenuItem } from './handlers/delete_menu_item';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new menu item
  createMenuItem: publicProcedure
    .input(createMenuItemInputSchema)
    .mutation(({ input }) => createMenuItem(input)),

  // Get all menu items
  getMenuItems: publicProcedure
    .query(() => getMenuItems()),

  // Get a specific menu item by ID
  getMenuItemById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMenuItemById(input.id)),

  // Update an existing menu item
  updateMenuItem: publicProcedure
    .input(updateMenuItemInputSchema)
    .mutation(({ input }) => updateMenuItem(input)),

  // Delete a menu item
  deleteMenuItem: publicProcedure
    .input(deleteMenuItemInputSchema)
    .mutation(({ input }) => deleteMenuItem(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();