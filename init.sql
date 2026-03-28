CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(40) NOT NULL
        CHECK (char_length(nombre_completo) BETWEEN 8 AND 40),
    username VARCHAR(20) NOT NULL UNIQUE
        CHECK (char_length(username) BETWEEN 4 AND 20),
    email TEXT NOT NULL UNIQUE
        CHECK  (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(60),
    rol VARCHAR(10) NOT NULL DEFAULT 'CLIENTE'
        CHECK (rol IN ('ADMIN', 'CLIENTE')),
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    "lastLogin" TIMESTAMP,
    "deleteRequestedAt" TIMESTAMP,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiration" TIMESTAMP,
    "passwordChangedAt" TIMESTAMP,
    "isGoogle" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(40) NOT NULL
        CHECK (char_length(nombre) BETWEEN 3 AND 40),
    descripcion VARCHAR(200) NOT NULL
        CHECK (char_length(descripcion) BETWEEN 10 AND 200),
    imagen TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL
        CHECK (precio >= 0),
    stock INTEGER NOT NULL
        CHECK (stock >= 0),
    total_vendido INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    fecha_compra TIMESTAMP,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PAGADO', 'PENDIENTE', 'CANCELADO')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_tickets (
    id SERIAL PRIMARY KEY,
    id_articulo INTEGER NOT NULL,
    id_ticket INTEGER NOT NULL,
    nombre_articulo VARCHAR(40) NOT NULL
        CHECK (char_length(nombre_articulo) BETWEEN 3 AND 40),
    precio_unitario DECIMAL(10,2) NOT NULL
        CHECK (precio_unitario >= 0),
    cantidad INTEGER NOT NULL
        CHECK (cantidad >= 1),
    subtotal DECIMAL(10,2) NOT NULL
        CHECK (subtotal >= 0),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_ticket, id_articulo)
);

--AQUI SE CREAN LAS RELACIONES ENTRE LAS ENTIDADES
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'tickets_id_cliente_fkey'
        ) THEN
            ALTER TABLE tickets
            ADD CONSTRAINT tickets_id_cliente_fkey
            FOREIGN KEY (id_cliente)
            REFERENCES usuarios(id);
        END IF;
END $$;

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'detalle_tickets_id_ticket_fkey'
        ) THEN
            ALTER TABLE detalle_tickets
            ADD CONSTRAINT detalle_tickets_id_ticket_fkey
            FOREIGN KEY (id_ticket)
            REFERENCES tickets(id);
        END IF;
END $$;

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'detalle_tickets_id_articulo_fkey'
        ) THEN
            ALTER TABLE detalle_tickets
            ADD CONSTRAINT detalle_tickets_id_articulo_fkey
            FOREIGN KEY (id_articulo)
            REFERENCES articulos(id);
        END IF;
END $$;

--TRIGGER PARA ACTUALIZAR EL CAMPO UPDATEDAT
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--AQUI SE ESTABLECE QUE AL HACER UN UPDATE SE LLAME AL METODO DE ARRIBA
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_usuarios_updatedAt'
    ) THEN
        CREATE TRIGGER "trigger_usuarios_updatedAt"
        BEFORE UPDATE ON usuarios
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_articulos_updatedAt'
    ) THEN
        CREATE TRIGGER "trigger_articulos_updatedAt"
        BEFORE UPDATE ON articulos
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_tickets_updatedAt'
    ) THEN
        CREATE TRIGGER "trigger_tickets_updatedAt"
        BEFORE UPDATE ON tickets
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_detalle_updatedAt'
    ) THEN
        CREATE TRIGGER "trigger_detalle_updatedAt"
        BEFORE UPDATE ON detalle_tickets
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;