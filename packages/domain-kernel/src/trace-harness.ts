export type TraceHarnessConfig<State, Event, Command> = {
  initialState: State;
  reduce: (state: State, event: Event) => State;
  handleCommand: (events: ReadonlyArray<Event>, command: Command) => ReadonlyArray<Event>;
};

export function createTraceHarness<State, Event, Command>(
  config: TraceHarnessConfig<State, Event, Command>,
) {
  return {
    given(events: ReadonlyArray<Event>) {
      return {
        when(command: Command) {
          const emittedEvents = config.handleCommand(events, command);
          const allEvents = [...events, ...emittedEvents];
          const state = allEvents.reduce(config.reduce, config.initialState);

          return {
            events: allEvents,
            state,
            expect(expectedState: State) {
              return {
                pass: Object.is(JSON.stringify(state), JSON.stringify(expectedState)),
                state,
              };
            },
          };
        },
      };
    },
  };
}
