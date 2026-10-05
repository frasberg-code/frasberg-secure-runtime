class LuchiiContext:
    def __init__(self):
        self.state = {}

    def update(self, key, value) -> None:
        self.state[key] = value
